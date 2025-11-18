export const translations = {
  sr: {
    // Auth
    signIn: "Пријава",
    signUp: "Регистрација",
    email: "Имејл",
    password: "Лозинка",
    fullName: "Пуно име",
    alreadyHaveAccount: "Већ имате налог?",
    dontHaveAccount: "Немате налог?",
    loading: "Учитавање...",
    
    // User types
    userType: "Тип корисника",
    individual: "Приватно лице",
    business: "Власник бизниса",
    selectUserType: "Изаберите тип корисника",
    
    // Location
    country: "Држава",
    city: "Град",
    selectCountry: "Изаберите државу",
    selectCity: "Изаберите град",
    
    // Header
    map: "Мапа",
    allLocations: "Све локације",
    tours: "Туре",
    adminPanel: "Админ панел",
    signOut: "Одјава",
    language: "Језик",
    location: "Локација",
    
    // Map
    distance: "Удаљеност од вас",
    categories: "Категорије",
    places: "Места",
    premium: "Премиум",
    details: "Детаљи",
    googleMaps: "Google Maps",
    customLink: "Линк",
    
    // Initial setup
    welcome: "Добродошли",
    selectLanguage: "Изаберите језик",
    selectYourCity: "Изаберите своју локацију",
    continue: "Настави",
    
    // Common
    save: "Сачувај",
    cancel: "Откажи",
    delete: "Обриши",
    edit: "Измени",
    add: "Додај",
    back: "Назад",
    close: "Затвори",
  },
  ru: {
    // Auth
    signIn: "Вход",
    signUp: "Регистрация",
    email: "Email",
    password: "Пароль",
    fullName: "Полное имя",
    alreadyHaveAccount: "Уже есть аккаунт?",
    dontHaveAccount: "Нет аккаунта?",
    loading: "Загрузка...",
    
    // User types
    userType: "Тип пользователя",
    individual: "Частное лицо",
    business: "Владелец бизнеса",
    selectUserType: "Выберите тип пользователя",
    
    // Location
    country: "Страна",
    city: "Город",
    selectCountry: "Выберите страну",
    selectCity: "Выберите город",
    
    // Header
    map: "Карта",
    allLocations: "Все локации",
    tours: "Туры",
    adminPanel: "Панель администратора",
    signOut: "Выход",
    language: "Язык",
    location: "Локация",
    
    // Map
    distance: "Расстояние от вас",
    categories: "Категории",
    places: "Места",
    premium: "Премиум",
    details: "Детали",
    googleMaps: "Google Maps",
    customLink: "Ссылка",
    
    // Initial setup
    welcome: "Добро пожаловать",
    selectLanguage: "Выберите язык",
    selectYourCity: "Выберите вашу локацию",
    continue: "Продолжить",
    
    // Common
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Изменить",
    add: "Добавить",
    back: "Назад",
    close: "Закрыть",
  },
  en: {
    // Auth
    signIn: "Sign In",
    signUp: "Sign Up",
    email: "Email",
    password: "Password",
    fullName: "Full Name",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    loading: "Loading...",
    
    // User types
    userType: "User Type",
    individual: "Individual",
    business: "Business Owner",
    selectUserType: "Select user type",
    
    // Location
    country: "Country",
    city: "City",
    selectCountry: "Select country",
    selectCity: "Select city",
    
    // Header
    map: "Map",
    allLocations: "All Locations",
    tours: "Tours",
    adminPanel: "Admin Panel",
    signOut: "Sign Out",
    language: "Language",
    location: "Location",
    
    // Map
    distance: "Distance from you",
    categories: "Categories",
    places: "Places",
    premium: "Premium",
    details: "Details",
    googleMaps: "Google Maps",
    customLink: "Link",
    
    // Initial setup
    welcome: "Welcome",
    selectLanguage: "Select language",
    selectYourCity: "Select your location",
    continue: "Continue",
    
    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    back: "Back",
    close: "Close",
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
