import Banner from './components/Banner';
import Header from './components/Header';
import HomePage from './components/HomePage';
import Footer from './components/Footer';
import { useSearchParams } from 'react-router-dom';

function App() {
    const [searchParams] = useSearchParams();
    const selectedCategory = searchParams.get('brand') || 'all';

    return (
        <div>
            <header>
                <Header />
            </header>

            <main>
                {selectedCategory === 'all' && <Banner />}
                <HomePage />
                <Footer />
            </main>
        </div>
    );
}

export default App;
