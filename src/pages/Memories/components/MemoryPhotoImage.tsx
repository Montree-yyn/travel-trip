import { memo, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export const MemoryPhotoImage = memo(function MemoryPhotoImage({
  src,
  alt = "",
  className,
  priority = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-ink/8", className)}>
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-ink/5 via-ink/10 to-ink/5" />
      )}
      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "size-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-ink/10 text-xs text-ink-faint">
          !
        </div>
      )}
    </div>
  );
});
