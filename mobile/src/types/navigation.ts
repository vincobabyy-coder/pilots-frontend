export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Deliveries: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type DeliveryStackParamList = {
  DeliveryDetail: { deliveryId: string };
  DeliveryConfirm: { deliveryId: string };
};
