const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`      <iframe
        ref={iframeRef}
        src={\`\${umapBaseUrl}#17/48.271993/-3.560402\`}
        className="absolute inset-0 z-0 w-full h-full"
        style={{
          border: "none",
          pointerEvents: "auto",
        }}
        title="Umap Background"
      />`,
`      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <iframe
          ref={iframeRef}
          src={\`\${umapBaseUrl}#17/48.271993/-3.560402\`}
          className="absolute z-0 pointer-events-auto"
          style={{
            border: "none",
            width: "200%",
            height: "200%",
            left: "-50%",
            top: "-50%",
          }}
          title="Umap Background"
        />
      </div>`
);

fs.writeFileSync('src/components/BinMap.tsx', code);
