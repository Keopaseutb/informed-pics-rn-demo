export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export type Market = {
  id: string;
  line: number;
  unit: string | null;
  sport: string;
  gameid: number;
  propid: number;
  category: string;
  question: string;
  startsat: string;
  eventlabel: string;
  playername: string;
  nodecimalodds: number;
  noamericanodds: number;
  yesdecimalodds: number;
  yesamericanodds: number;
};

export type MarketCategory = Market["category"];
