export type TabParamList = {
  ImageList: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
  Main: { screen: keyof TabParamList } | undefined;
};