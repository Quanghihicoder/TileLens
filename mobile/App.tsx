import { NotificationProvider } from './src/providers/Notification';
import { Provider } from 'react-redux';
import { store } from './src/app/store';
import AppRoot from './src/AppRoot';

function App() {
  return (
    <Provider store={store}>
      <NotificationProvider>
        <AppRoot />
      </NotificationProvider>
    </Provider>
  );
}

export default App;
