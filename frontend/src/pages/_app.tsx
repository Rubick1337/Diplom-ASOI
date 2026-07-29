import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { store } from '@/shared/store/store';
import { ThemeProvider } from '@/shared/context/ThemeContext';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <Provider store={store}>
            <ThemeProvider>
                <Component {...pageProps} />
            </ThemeProvider>
        </Provider>
    );
}
