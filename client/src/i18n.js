import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "menu": {
                "dashboard": "Dashboard",
                "vehicleRegistry": "Vehicle Registry",
                "tripDispatcher": "Trip Dispatcher",
                "maintenance": "Maintenance",
                "tripExpenses": "Trip Expenses",
                "performance": "Performance",
                "analytics": "Analytics",
                "adminPanel": "Admin Panel",
                "signOut": "Sign Out"
            },
            "topbar": {
                "search": "Search anything (Ctrl+K)...",
                "language": "Language"
            },
            "dashboard": {
                "activeFleet": "Active Fleet",
                "totalVehicles": "{{count}} total vehicles",
                "maintenanceAlerts": "Maintenance Alerts",
                "vehiclesInShop": "Vehicles in shop",
                "utilizationRate": "Utilization Rate",
                "onTrip": "{{count}} on trip",
                "pendingCargo": "Pending Cargo",
                "awaitingDelivery": "Awaiting delivery",
                "liveTrips": "Live Active Trips",
                "route": "Route",
                "vehicle": "Vehicle",
                "driver": "Driver",
                "cargo": "Cargo",
                "status": "Status",
                "noTrips": "No active trips — all vehicles idle"
            },
            "login": {
                "title": "FleetFlow",
                "subtitle": "Fleet management reimagined",
                "username": "Username",
                "password": "Password",
                "signIn": "Sign In",
                "signingIn": "Signing in...",
                "quickLogin": "Quick Login"
            }
        }
    },
    hi: {
        translation: {
            "menu": {
                "dashboard": "डैशबोर्ड",
                "vehicleRegistry": "वाहन रजिस्ट्री",
                "tripDispatcher": "ट्रिप डिस्पैचर",
                "maintenance": "रखरखाव",
                "tripExpenses": "ट्रिप खर्च",
                "performance": "प्रदर्शन",
                "analytics": "एनालिटिक्स",
                "adminPanel": "एडमिन पैनल",
                "signOut": "साइन आउट"
            },
            "topbar": {
                "search": "कुछ भी खोजें (Ctrl+K)...",
                "language": "भाषा"
            },
            "dashboard": {
                "activeFleet": "सक्रिय बेड़ा (Active Fleet)",
                "totalVehicles": "कुल {{count}} वाहन",
                "maintenanceAlerts": "रखरखाव अलर्ट",
                "vehiclesInShop": "दुकान में वाहन",
                "utilizationRate": "उपयोग दर (Utilization)",
                "onTrip": "{{count}} यात्रा पर",
                "pendingCargo": "लंबित कार्गो",
                "awaitingDelivery": "डिलीवरी की प्रतीक्षा में",
                "liveTrips": "लाइव सक्रिय ट्रिप",
                "route": "मार्ग (Route)",
                "vehicle": "वाहन",
                "driver": "ड्राइवर",
                "cargo": "कार्गो",
                "status": "स्थिति",
                "noTrips": "कोई सक्रिय ट्रिप नहीं — सभी वाहन खाली हैं"
            },
            "login": {
                "title": "फ़्लीटफ़्लो (FleetFlow)",
                "subtitle": "फ़्लीट प्रबंधन की नई कल्पना",
                "username": "उपयोगकर्ता नाम",
                "password": "पासवर्ड",
                "signIn": "साइन इन करें",
                "signingIn": "साइन इन हो रहा है...",
                "quickLogin": "त्वरित लॉगिन"
            }
        }
    },
    gu: {
        translation: {
            "menu": {
                "dashboard": "ડેશબોર્ડ",
                "vehicleRegistry": "વાહન રજિસ્ટ્રી",
                "tripDispatcher": "ટ્રિપ ડિસ્પેચર",
                "maintenance": "જાળવણી",
                "tripExpenses": "ટ્રિપ ખર્ચ",
                "performance": "કામગીરી",
                "analytics": "એનાલિટિક્સ",
                "adminPanel": "એડમિન પેનલ",
                "signOut": "સાઇન આઉટ"
            },
            "topbar": {
                "search": "કંઈપણ શોધો (Ctrl+K)...",
                "language": "ભાષા"
            },
            "dashboard": {
                "activeFleet": "સક્રિય કાફલો",
                "totalVehicles": "કુલ {{count}} વાહનો",
                "maintenanceAlerts": "જાળવણી ચેતવણીઓ",
                "vehiclesInShop": "દુકાનમાં વાહનો",
                "utilizationRate": "ઉપયોગ દર",
                "onTrip": "{{count}} સફર પર",
                "pendingCargo": "બાકી કાર્ગો",
                "awaitingDelivery": "ડિલિવરીની રાહ જોવાય છે",
                "liveTrips": "લાઇવ સક્રિય ટ્રિપ્સ",
                "route": "માર્ગ (Route)",
                "vehicle": "વાહન",
                "driver": "ડ્રાઈવર",
                "cargo": "કાર્ગો",
                "status": "સ્થિતિ",
                "noTrips": "કોઈ સક્રિય ટ્રિપ નથી — બધા વાહનો ખાલી છે"
            },
            "login": {
                "title": "ફ્લીટફ્લો (FleetFlow)",
                "subtitle": "ફ્લીટ મેનેજમેન્ટની નવી કલ્પના",
                "username": "વપરાશકર્તા નામ",
                "password": "પાસવર્ડ",
                "signIn": "સાઇન ઇન કરો",
                "signingIn": "સાઇન ઇન થઈ રહ્યું છે...",
                "quickLogin": "ઝડપી લૉગિન"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
