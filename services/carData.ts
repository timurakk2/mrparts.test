import { CarModel } from "../types";

// Static data updated to match the simplified format:
// Model, Year Range, and Modification (Volume + Valves + Engine)

export const RENAULT_DB: CarModel[] = [
  {
    id: "duster",
    name: "Duster",
    generations: [
      {
        id: "duster_1",
        name: "2010-2015",
        years: [2010, 2011, 2012, 2013, 2014, 2015],
        modifications: [
          { id: "d1_1.6_k4m", name: "1.6 16V K4M", engine_code: "K4M" },
          { id: "d1_2.0_f4r", name: "2.0 16V F4R", engine_code: "F4R" },
          { id: "d1_1.5_k9k", name: "1.5 8V K9K", engine_code: "K9K" },
        ]
      },
      {
        id: "duster_1_rest",
        name: "Рестайлинг (2015-2021)",
        years: [2015, 2016, 2017, 2018, 2019, 2020, 2021],
        modifications: [
          { id: "d1r_1.6_h4m", name: "1.6 16V H4M", engine_code: "H4M" },
          { id: "d1r_2.0_f4r", name: "2.0 16V F4R", engine_code: "F4R" },
          { id: "d1r_1.5_k9k", name: "1.5 8V K9K", engine_code: "K9K" },
        ]
      }
    ]
  },
  {
    id: "logan",
    name: "Logan",
    generations: [
      {
        id: "logan_1",
        name: "1 (2004-2015)",
        years: [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014],
        modifications: [
            { id: "l1_1.4_k7j", name: "1.4 8V K7J", engine_code: "K7J" },
            { id: "l1_1.6_k7m", name: "1.6 8V K7M", engine_code: "K7M" },
            { id: "l1_1.6_k4m", name: "1.6 16V K4M", engine_code: "K4M" }
        ]
      },
      {
        id: "logan_2",
        name: "2 (2014-2022)",
        years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022],
        modifications: [
            { id: "l2_1.6_k7m", name: "1.6 8V K7M", engine_code: "K7M" },
            { id: "l2_1.6_k4m", name: "1.6 16V K4M", engine_code: "K4M" },
            { id: "l2_1.6_h4m", name: "1.6 16V H4M", engine_code: "H4M" }
        ]
      }
    ]
  },
  {
    id: "sandero",
    name: "Sandero",
    generations: [
      {
        id: "sandero_2",
        name: "2 (2014-2022)",
        years: [2014, 2015, 2016, 2017, 2018, 2019, 2020],
        modifications: [
            { id: "s2_1.6_k7m", name: "1.6 8V K7M", engine_code: "K7M" },
            { id: "s2_1.6_h4m", name: "1.6 16V H4M", engine_code: "H4M" }
        ]
      }
    ]
  },
  {
    id: "kaptur",
    name: "Kaptur",
    generations: [
      {
        id: "kaptur_1",
        name: "1 (2016-2020)",
        years: [2016, 2017, 2018, 2019, 2020],
        modifications: [
            { id: "k1_1.6_h4m", name: "1.6 16V H4M", engine_code: "H4M" },
            { id: "k1_2.0_f4r", name: "2.0 16V F4R", engine_code: "F4R" }
        ]
      }
    ]
  }
];