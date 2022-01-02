import { v4 as uuidv4 } from "uuid";

export default interface AlphabetPreset {
  id: string,
  name: string;
  alphabet: string[];
}

export const customAlphabetPreset = {
  id: uuidv4(),
  name: "Custom",
  alphabet: [],
};

export const alphabetPresets: AlphabetPreset[] = [
  {
    id: uuidv4(),
    name: "Binary digits (0-1)",
    alphabet: "01".split(""),
  },
  {
    id: uuidv4(),
    name: "Decimal digits (0-9)",
    alphabet: "0123456789".split(""),
  },
  {
    id: uuidv4(),
    name: "Upper-case letters (A-Z)",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  },
  {
    id: uuidv4(),
    name: "Lower-case letters (a-z)",
    alphabet: "abcdefghijklmnopqrstuvwxyz".split(""),
  },
  {
    id: uuidv4(),
    name: "Upper- & lower-case letters (A-Z, a-z)",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(""),
  },
  customAlphabetPreset,
];
