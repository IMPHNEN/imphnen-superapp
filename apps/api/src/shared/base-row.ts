export type TBaseEventRow = {
  id: string;
  createdAt: Date;
};

export type TBaseRow = TBaseEventRow & {
  updatedAt: Date;
};
