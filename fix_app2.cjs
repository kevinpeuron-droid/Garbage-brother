const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
`  const [isExternal] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.has("ext");
    }
    return false;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => !isExternal);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("ext", "true");
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };`,
`  const [isExternal] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.has("ext");
    }
    return false;
  });

  const [deviceType] = useState<"pc" | "mobile">(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("device")) {
        return searchParams.get("device") as "pc" | "mobile";
      }
    }
    return typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "pc";
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => !isExternal);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [copiedPC, setCopiedPC] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);

  const handleShare = (device: "pc" | "mobile") => {
    const url = new URL(window.location.href);
    url.searchParams.set("ext", "true");
    url.searchParams.set("device", device);
    navigator.clipboard.writeText(url.toString());
    if (device === "pc") {
      setCopiedPC(true);
      setTimeout(() => setCopiedPC(false), 2000);
    } else {
      setCopiedMobile(true);
      setTimeout(() => setCopiedMobile(false), 2000);
    }
  };`
);

fs.writeFileSync('src/App.tsx', code);
