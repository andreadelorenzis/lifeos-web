type ThemeSetter<T = any> = (value: any, component: T) => void;
type ThemeGetter = () => any | undefined;

interface ThemeRegistration<T = any> {
  component: T;
  getValue: ThemeGetter; // e.g. read CSS var
  setValue: ThemeSetter<T>; // e.g. set Pixi Text.fill or Graphics.tint
}

class ThemeManager {
  private elements: ThemeRegistration[] = [];

  register<T>(component: T, getValue: ThemeGetter, setValue: ThemeSetter<T>) {
    this.elements.push({ component, getValue, setValue });
  }

  unregister<T>(component: T) {
    this.elements = this.elements.filter((e) => e.component !== component);
  }

  updateTheme() {
    this.elements = this.elements.filter((e) => {
      // Auto-unregister if the Pixi component was destroyed
      if (
        e.component &&
        typeof (e.component as any).destroyed === "boolean" &&
        (e.component as any).destroyed
      ) {
        return false;
      }
      return true;
    });

    this.elements.forEach(({ component, getValue, setValue }) => {
      const value = getValue();
      if (value !== undefined) setValue(value, component);
    });
  }
}

export const themeManager = new ThemeManager();
