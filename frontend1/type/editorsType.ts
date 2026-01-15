export type Trigger = {
  id: string;
  name: string;
  image: string;
  metadata?:any
};

export type Action = {
  id: string;
  name: string;
  image: string;
  metadata?:any
};

export type TriggerResponse = {
  availableTriggers: Trigger[];
};

export type ActionResponse = {
  availableActions: Action[];
};