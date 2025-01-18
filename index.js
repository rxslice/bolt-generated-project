import { AppRegistry, Platform } from 'react-native';
    import App from './src/App';
    import { name as appName } from './app.json';

    if (Platform.OS === 'web') {
      import('react-dom/client').then((ReactDOM) => {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
      });
    } else {
      AppRegistry.registerComponent(appName, () => App);
    }
