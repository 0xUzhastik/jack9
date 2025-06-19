declare module 'react-curved-text' {
  interface ReactCurvedTextProps {
    width: number;
    height: number;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    startOffset: number;
    reversed?: boolean;
    text: string;
    textProps?: React.SVGProps<SVGTextElement>;
    textPathProps?: React.SVGProps<SVGTextPathElement>;
    [key: string]: any;
  }

  const ReactCurvedText: React.FC<ReactCurvedTextProps>;
  export default ReactCurvedText;
}