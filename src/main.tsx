import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'

// 自定义主题
const theme = extendTheme({
  colors: {
    primary: {
      50: '#e6f0ff',
      100: '#cce0ff',
      200: '#99c2ff',
      300: '#66a3ff',
      400: '#3385ff',
      500: '#0066ff',
      600: '#0052cc',
      700: '#003d99',
      800: '#002966',
      900: '#001433',
    },
  },
  fonts: {
    heading: 'system-ui, sans-serif',
    body: 'system-ui, sans-serif',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)