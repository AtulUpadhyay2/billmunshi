import { createSlice } from "@reduxjs/toolkit";

// theme config import
import themeConfig from "@/config/themeConfig";
// Layout choices are "preferences" cookies, so persisting them needs
// consent. setPreference is a no-op until the visitor grants it — the
// UI still responds instantly, the choice just doesn't outlive the tab.
// Reads stay direct: if a key is present, it was written with consent,
// and withdrawing consent deletes it.
import { setPreference } from "@/utils/cookieConsent";

const initialDarkMode = () => {
  const item = window.localStorage.getItem("darkMode");
  return item ? JSON.parse(item) : themeConfig.layout.darkMode;
};

const initialSidebarCollapsed = () => {
  const item = window.localStorage.getItem("sidebarCollapsed");
  return item ? JSON.parse(item) : themeConfig.layout.menu.isCollapsed;
};

const initialSemiDarkMode = () => {
  const item = window.localStorage.getItem("semiDarkMode");
  return item ? JSON.parse(item) : themeConfig.layout.semiDarkMode;
};

const initialRtl = () => {
  const item = window.localStorage.getItem("direction");
  return item ? JSON.parse(item) : themeConfig.layout.isRTL;
};

const initialSkin = () => {
  const item = window.localStorage.getItem("skin");
  return item ? JSON.parse(item) : themeConfig.layout.skin;
};

const initialType = () => {
  const item = window.localStorage.getItem("type");
  return item ? JSON.parse(item) : themeConfig.layout.type;
};

const initialMonochrome = () => {
  const item = window.localStorage.getItem("monochrome");
  return item ? JSON.parse(item) : themeConfig.layout.isMonochrome;
};
const initialState = {
  isRTL: initialRtl(),
  darkMode: initialDarkMode(),
  isCollapsed: initialSidebarCollapsed(),
  customizer: themeConfig.layout.customizer,
  semiDarkMode: initialSemiDarkMode(),
  skin: initialSkin(),
  contentWidth: themeConfig.layout.contentWidth,
  type: initialType(),
  menuHidden: themeConfig.layout.menu.isHidden,
  navBarType: "sticky",
  footerType: "sticky",
  mobileMenu: themeConfig.layout.mobileMenu,
  isMonochrome: initialMonochrome(),
};

export const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    // handle dark mode
    handleDarkMode: (state, action) => {
      state.darkMode = action.payload;
      setPreference("darkMode", action.payload);
    },
    // handle sidebar collapsed
    handleSidebarCollapsed: (state, action) => {
      state.isCollapsed = action.payload;
      setPreference("sidebarCollapsed", action.payload);
    },
    // handle customizer
    handleCustomizer: (state, action) => {
      state.customizer = action.payload;
    },
    // handle semiDark
    handleSemiDarkMode: (state, action) => {
      state.semiDarkMode = action.payload;
      setPreference("semiDarkMode", action.payload);
    },
    // handle rtl
    handleRtl: (state, action) => {
      state.isRTL = action.payload;
      setPreference("direction", JSON.stringify(action.payload));
    },
    // handle skin
    handleSkin: (state, action) => {
      state.skin = action.payload;
      setPreference("skin", JSON.stringify(action.payload));
    },
    // handle content width
    handleContentWidth: (state, action) => {
      state.contentWidth = action.payload;
    },
    // handle type
    handleType: (state, action) => {
      state.type = action.payload;
      setPreference("type", JSON.stringify(action.payload));
    },
    // handle menu hidden
    handleMenuHidden: (state, action) => {
      state.menuHidden = action.payload;
    },
    // handle navbar type — forced to sticky
    handleNavBarType: (state) => {
      state.navBarType = "sticky";
    },
    // handle footer type — forced to sticky
    handleFooterType: (state) => {
      state.footerType = "sticky";
    },
    handleMobileMenu: (state, action) => {
      state.mobileMenu = action.payload;
    },
    handleMonoChrome: (state, action) => {
      state.isMonochrome = action.payload;
      setPreference("monochrome", JSON.stringify(action.payload));
    },
  },
});

export const {
  handleDarkMode,
  handleSidebarCollapsed,
  handleCustomizer,
  handleSemiDarkMode,
  handleRtl,
  handleSkin,
  handleContentWidth,
  handleType,
  handleMenuHidden,
  handleNavBarType,
  handleFooterType,
  handleMobileMenu,
  handleMonoChrome,
} = layoutSlice.actions;

export default layoutSlice.reducer;
