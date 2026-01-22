import { useTranslation } from 'react-i18next';
import { useCurrency } from '../contexts/CurrencyContext';

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { currency, setCurrency } = useCurrency();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div>
            <div className="page-header mb-10">
                <h1 className="page-title">{t('settings.title')}</h1>
                <p className="page-subtitle">{t('settings.subtitle')}</p>
            </div>

            <div className="flex flex-col gap-6">
                {/* Language Settings */}
                <div className="card-elevated">
                    <h2 className="text-lg font-bold mb-4 text-text-primary">{t('settings.language')}</h2>
                    <label className="text-xs font-bold text-text-tertiary uppercase mb-3 block tracking-wider">
                        {t('settings.selectLanguage')}
                    </label>
                    <div className="segmented-control" style={{ maxWidth: '400px' }}>
                        <button
                            type="button"
                            className={`segmented-option ${i18n.language === 'en' ? 'active' : ''}`}
                            onClick={() => changeLanguage('en')}
                        >
                            English
                        </button>
                        <button
                            type="button"
                            className={`segmented-option ${i18n.language === 'tr' ? 'active' : ''}`}
                            onClick={() => changeLanguage('tr')}
                        >
                            Türkçe
                        </button>
                    </div>
                </div>

                {/* Currency Settings */}
                <div className="card-elevated">
                    <h2 className="text-lg font-bold mb-4 text-text-primary">{t('settings.currency')}</h2>
                    <label className="text-xs font-bold text-text-tertiary uppercase mb-3 block tracking-wider">
                        {t('settings.selectCurrency')}
                    </label>
                    <div className="segmented-control" style={{ maxWidth: '500px' }}>
                        <button
                            type="button"
                            className={`segmented-option ${currency === 'USD' ? 'active' : ''}`}
                            onClick={() => setCurrency('USD')}
                        >
                            <span style={{ marginRight: '0.5rem' }}>$</span>
                            USD
                        </button>
                        <button
                            type="button"
                            className={`segmented-option ${currency === 'TRY' ? 'active' : ''}`}
                            onClick={() => setCurrency('TRY')}
                        >
                            <span style={{ marginRight: '0.5rem' }}>₺</span>
                            TRY
                        </button>
                        <button
                            type="button"
                            className={`segmented-option ${currency === 'EUR' ? 'active' : ''}`}
                            onClick={() => setCurrency('EUR')}
                        >
                            <span style={{ marginRight: '0.5rem' }}>€</span>
                            EUR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
