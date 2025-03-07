import * as radixColors from '@radix-ui/colors';
import * as React from 'react';

import { Theme } from '$/types/theme.type';

import { siteTheme } from './siteTheme';
import { getThemeCSSVariablesString, translateRadixColor } from './utilities';

const siteColors = siteTheme.colors;
const FIXED_COLORS = {
  whitea: translateRadixColor(radixColors.whiteA),
  blacka: translateRadixColor(radixColors.blackA),
};

export type Selectors = {
  light: string;
  dark: string;
};

export function useThemeVariables(theme?: Theme, selectors?: Selectors) {
  const { light, dark } = {
    light: ':root',
    dark: ':root.dark',
    ...selectors,
  };
  const styles = React.useMemo(() => {
    const lightTheme = {
      colors: {
        ...FIXED_COLORS,
        ...siteColors.light,
        ...theme?.colors.light,
      },
    };
    const darkTheme = {
      colors: {
        ...siteColors.dark,
        ...theme?.colors.dark,
      },
    };
    return `${light} {
        ${getThemeCSSVariablesString(lightTheme)}
      }
    
       ${dark} {
        ${getThemeCSSVariablesString(darkTheme)}
      }
    `;
  }, [theme, light, dark]);
  return { styles };
}
