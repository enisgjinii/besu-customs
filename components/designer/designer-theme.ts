import { createTheme } from "@mui/material/styles";

export const designerTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#171717", contrastText: "#ffffff" },
    secondary: { main: "#000000", contrastText: "#ffffff" },
    background: { default: "#ffffff", paper: "#ffffff" },
    success: { main: "#277a4b" },
    error: { main: "#b43b2d" },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "var(--font-macan), Inter, system-ui, sans-serif",
    h4: { fontWeight: 700, letterSpacing: "-0.025em" },
    h6: { fontWeight: 700, letterSpacing: "-0.02em" },
    button: { fontWeight: 700, textTransform: "none" },
    overline: { fontWeight: 700, letterSpacing: "0.16em" },
  },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: 44, boxShadow: "none" } } },
    MuiCard: { styleOverrides: { root: { border: 0, boxShadow: "none", borderRadius: 0 } } },
    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiFormControl: { defaultProps: { size: "small", fullWidth: true } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});
