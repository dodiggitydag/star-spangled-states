export interface StateData {
  name: string;
  abbr: string;
  capital: string;
  region: Region;
  hint: string;
}

export enum Region {
  ALL = 'All',
  NORTHEAST = 'Northeast',
  MIDWEST = 'Midwest',
  SOUTH = 'South',
  WEST = 'West',
}

export enum GameMode {
  FLASHCARD = 'Flashcard',
  FIND_STATE = 'Find the State',
  CAPITAL_QUIZ = 'Capital Quiz',
  STATE_MATCH = 'State Match',
}

export interface MapCustomization {
  [abbr: string]: {
    fill: string;
    clickHandler?: (event: any) => void;
  };
}