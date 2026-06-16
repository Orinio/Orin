declare module 'mermaid' {
  const mermaid: {
    initialize: (config: Record<string, any>) => void;
    render: (id: string, code: string) => Promise<{ svg: string }>;
  };
  export default mermaid;
}
