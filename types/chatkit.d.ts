declare namespace JSX {
  interface IntrinsicElements {
    'openai-chatkit': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        'api-url'?: string
        'initial-thread'?: string | null
        'theme'?: 'light' | 'dark'
      },
      HTMLElement
    >
  }
}
