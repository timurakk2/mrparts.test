import { supabase } from '../supabaseClient';
import { CarModel, CarGeneration, CarModification } from '../types';

// --- ROBUST PARSING LOGIC ---

const CYRILLIC_MAP: Record<string, string> = {
  'АРКАНА': 'Arkana', 'ARKANA': 'Arkana',
  'ЛОГАН': 'Logan', 'LOGAN': 'Logan',
  'ДАСТЕР': 'Duster', 'DUSTER': 'Duster',
  'САНДЕРО': 'Sandero', 'SANDERO': 'Sandero',
  'КАПТЮР': 'Kaptur', 'КАПТУР': 'Kaptur', 'KAPTUR': 'Kaptur',
  'МЕГАН': 'Megane', 'MEGANE': 'Megane',
  'КЛИО': 'Clio', 'CLIO': 'Clio',
  'ФЛЮЕНС': 'Fluence', 'FLUENCE': 'Fluence',
  'СИМБОЛ': 'Symbol', 'SYMBOL': 'Symbol',
  'КАНГУ': 'Kangoo', 'KANGOO': 'Kangoo',
  'МАСТЕР': 'Master', 'MASTER': 'Master',
  'ТРАФИК': 'Trafic', 'TRAFIC': 'Trafic',
  'ДОККЕР': 'Dokker', 'DOKKER': 'Dokker',
  'ЛАРГУС': 'Largus', 'LARGUS': 'Largus',
  'СЦЕНИК': 'Scenic', 'SCENIC': 'Scenic',
  'ЭСПЕЙС': 'Espace', 'ESPACE': 'Espace',
  'КОЛЕОС': 'Koleos', 'KOLEOS': 'Koleos',
  'ЛАГУНА': 'Laguna', 'LAGUNA': 'Laguna',
  'ЛАТИТЮД': 'Latitude', 'LATITUDE': 'Latitude',
  'ТАЛИЯ': 'Thalia', 'THALIA': 'Thalia'
};

const ROMAN_TO_ARABIC: Record<string, string> = {
    'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5', 'VI': '6'
};

export interface ParsedCarData {
    fullString: string; 
    modelName: string; 
    yearRange: string;
    volume: string;
    valves: string;
    engine: string;
    power: string;
    isComplete: boolean;
    missing: string[];
}

export const parseCarString = (raw: string): ParsedCarData => {
    if (!raw) return createEmpty();

    // 1. AGGRESSIVE CLEANING
    // Convert 1,6 -> 1.6
    let clean = raw.toString().replace(/(\d),(\d)/g, '$1.$2');
    
    // Replace all brackets, slashes, commas with SPACES to isolate tokens
    // "Аркана (двигатель H4M)" -> "АРКАНА  ДВИГАТЕЛЬ H4M "
    clean = clean.replace(/[()\[\]\/,;]/g, ' ').toUpperCase();
    
    // Normalize spaces
    clean = clean.replace(/\s+/g, ' ').trim();

    // --- 1. MODEL ---
    let foundModelKey = '';
    let foundModelName = '';

    for (const [cyr, eng] of Object.entries(CYRILLIC_MAP)) {
        if (clean.includes(cyr)) {
            foundModelKey = eng;
            break;
        }
    }

    // Generation (I, II, III or 1, 2, 3)
    let generationSuffix = '';
    
    // Check Roman Numerals and convert to Arabic
    const romanMatch = clean.match(/\b(VI|V|IV|III|II|I)\b/);
    if (romanMatch) {
        generationSuffix = ROMAN_TO_ARABIC[romanMatch[1]] || romanMatch[1];
    } else if (foundModelKey) {
        // Check Digit Generation near model name
        const modelIdx = clean.indexOf(foundModelKey.toUpperCase());
        if (modelIdx === -1) {
             const cyrKey = Object.keys(CYRILLIC_MAP).find(k => CYRILLIC_MAP[k] === foundModelKey);
             if (cyrKey) {
                 const cyrIdx = clean.indexOf(cyrKey);
                 if (cyrIdx !== -1) {
                     const after = clean.slice(cyrIdx + cyrKey.length).trim();
                     const digit = after.match(/^(\d)\b/);
                     if (digit) generationSuffix = digit[1];
                 }
             }
        } else {
             const after = clean.slice(modelIdx + foundModelKey.length).trim();
             const digit = after.match(/^(\d)\b/);
             if (digit) generationSuffix = digit[1];
        }
    }

    // EXCEPTION: Duster, Arkana, Kaptur, Kangoo have no generation numbers in the Model Name
    if (['Duster', 'Arkana', 'Kaptur', 'Kangoo'].includes(foundModelKey)) {
        generationSuffix = '';
    }

    // EXCEPTION: "Logan 1" is just "Logan"
    if (foundModelKey === 'Logan' && generationSuffix === '1') {
        generationSuffix = '';
    }

    foundModelName = foundModelKey 
        ? (foundModelKey + (generationSuffix ? ` ${generationSuffix}` : ''))
        : '';
    // Capitalize properly (e.g. "Logan 2", "Duster")
    if (foundModelName) {
        // Split by space to capitalize words, but keep numbers as is
        foundModelName = foundModelName.split(' ')
            .map(w => /^\d+$/.test(w) ? w : capitalize(w))
            .join(' ');
    }

    // --- 2. VOLUME (1.6, 2.0, etc) ---
    const volMatch = clean.match(/\b(\d\.\d)\b/);
    const volume = volMatch ? volMatch[1] : '';

    // --- 3. VALVES (8V, 16V, 16 КЛ) ---
    const valveMatch = clean.match(/\b(8|16)\s*(V|КЛ|KL|VALVE)/);
    const valves = valveMatch ? `${valveMatch[1]}V` : '';

    // --- 4. ENGINE ---
    // Token-based search for Renault engine codes (K4M, F4R, etc.)
    const tokens = clean.split(' ');
    let engine = '';

    const RENAULT_PREFIXES = ['K', 'F', 'H', 'M', 'D', 'E', 'R', 'V'];
    // Expanded blacklist to ignore transmission/drive terms during engine search
    const BLACKLIST = ['4X4', '4X2', '2WD', '4WD', 'AWD', 'FWD', 'CVT', 'ABS', 'ESP', 'GTE', 'DCI', '16V', 'MT', 'AT', 'AUTOMAT', 'VARIATOR'];

    for (const token of tokens) {
        if (token.length < 3) continue;
        if (BLACKLIST.includes(token)) continue;

        // Pattern: [Letter][Digit][Letter]...
        const isRenaultPattern = /^[A-Z]\d[A-Z]/.test(token);
        
        if (isRenaultPattern) {
            if (RENAULT_PREFIXES.includes(token[0])) {
                engine = token;
                break; // Strong match found
            }
            if (!engine) engine = token; // Weak match candidate
        }
    }

    // --- 5. YEARS ---
    let yearRange = '';
    const rangeMatch = clean.match(/(19\d{2}|20\d{2})\s*[-–]\s*(20\d{2}|Н\.?В|НАСТ|\.\.\.)/);
    
    if (rangeMatch) {
        const start = rangeMatch[1];
        let end = rangeMatch[2];
        if (end.includes('Н') || end.includes('.')) {
            end = 'н.в.';
        }
        yearRange = `${start}-${end}`;
    }

    // --- 6. POWER ---
    let power = '';
    const powerMatch = clean.match(/\b(\d{2,3})\s*(HP|LS|Л\.?С\.?|ЛС|CV|CH)\b/i);
    if (powerMatch) {
        power = `${powerMatch[1]} л.с.`;
    }

    // --- VALIDATION ---
    const missing: string[] = [];
    if (!foundModelName) missing.push('Модель');
    if (!yearRange) missing.push('Годы');
    if (!volume) missing.push('Объем');
    if (!valves) missing.push('Клапаны');
    if (!engine) missing.push('Двигатель');

    const isComplete = missing.length === 0;

    // Full String for deduplication (Model | Years | Volume Valves Engine)
    const fullString = `${foundModelName} | ${yearRange} | ${volume} ${valves} ${engine}`;

    return {
        fullString,
        modelName: foundModelName,
        yearRange,
        volume,
        valves,
        engine,
        power,
        isComplete,
        missing
    };
};

// Helper to construct a clean string for storage
export const formatCarString = (model: string, years: string, modification: string): string => {
    return `${model} | ${years} | ${modification}`;
};

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function createEmpty(): ParsedCarData {
    return { fullString: '', modelName: '', yearRange: '', volume: '', valves: '', engine: '', power: '', isComplete: false, missing: ['No Data'] };
}


// --- TREE BUILDING LOGIC ---

export const fetchDynamicCarTree = async (): Promise<CarModel[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('compatibility');

    if (error) throw error;
    if (!data) return [];

    const modelMap = new Map<string, CarModel>();
    const processedGroups = new Set<string>();

    data.forEach((row: any) => {
      if (Array.isArray(row.compatibility)) {
        row.compatibility.forEach((c: any) => {
          if (!c.model) return;
          
          const parsed = parseCarString(c.model);

          if (!parsed.isComplete) return;

          if (processedGroups.has(parsed.fullString)) return;
          processedGroups.add(parsed.fullString);

          // 1. Model
          let carModel = modelMap.get(parsed.modelName);
          if (!carModel) {
            carModel = { id: parsed.modelName, name: parsed.modelName, generations: [] };
            modelMap.set(parsed.modelName, carModel);
          }

          // 2. Generation (Year Range)
          let generation = carModel.generations.find(g => g.name === parsed.yearRange);
          if (!generation) {
            generation = {
                id: `${parsed.modelName}_${parsed.yearRange}`.replace(/[^a-zA-Z0-9]/g, ''),
                name: parsed.yearRange,
                years: [],
                modifications: []
            };
            carModel.generations.push(generation);
          }

          // 3. Modification
          // Construct strict Name: Volume + Valves + Engine
          const modNameParts = [parsed.volume, parsed.valves, parsed.engine].filter(Boolean);
          
          const modName = modNameParts.join(' ');
          const modId = `${parsed.modelName}_${parsed.yearRange}_${modName}`.replace(/[^a-zA-Z0-9]/g, '');

          if (!generation.modifications.some(m => m.name === modName)) {
              generation.modifications.push({
                  id: modId,
                  name: modName,
                  engine_code: parsed.engine,
              });
          }
        });
      }
    });

    // Sorting
    const sortedModels = Array.from(modelMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    
    sortedModels.forEach(m => {
        // Sort Year Ranges (Newest first)
        m.generations.sort((a, b) => {
            const getStartYear = (str: string) => {
                const match = str.match(/^(\d{4})/);
                return match ? parseInt(match[1]) : 0;
            };
            return getStartYear(b.name) - getStartYear(a.name);
        });
        
        // Sort modifications (Volume desc)
        m.generations.forEach(g => {
            g.modifications.sort((a, b) => {
                 const volA = parseFloat(a.name) || 0;
                 const volB = parseFloat(b.name) || 0;
                 return volB - volA; 
            });
        });
    });

    return sortedModels;

  } catch (err) {
    console.error("Error building car tree:", err);
    return [];
  }
};