import { COUNTRIES } from "@/enums/countries";

export type BoatDynamicFields = {
  [key in
    | `tab-${number}-color-${number}`
    | `option-${number}-text`
    | `option-${number}-code`]?: string;
};

export type BoatBase = {
  name: string;
  country: COUNTRIES;
  email: string;
  phone: string;
  city: string;
  comment: string;
  screen: string;
  link: string;
};

export type Boat = BoatBase & BoatDynamicFields;
