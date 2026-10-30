import type { ComponentProps } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

/** Only these elements are styled/allowed overrides; content is repo-authored and trusted. */
const components = {
  a: ({ href = "", ...props }: ComponentProps<"a">) => {
    const external = /^https?:\/\//.test(href);
    return <a href={href} {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})} {...props} />;
  },
  table: (props: ComponentProps<"table">) => (
    <div className="prose__scroll" tabIndex={0}>
      <table {...props} />
    </div>
  ),
  pre: (props: ComponentProps<"pre">) => <pre className="prose__scroll" tabIndex={0} dir="ltr" {...props} />,
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ alt = "", ...props }: ComponentProps<"img">) => <img alt={alt} loading="lazy" decoding="async" {...props} />,
};

export function Mdx({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />;
}
