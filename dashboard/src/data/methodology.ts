export interface ReadmeSection {
  title: string;
  body: string;
}

export function extractReadmeSections(readme: string): ReadmeSection[] {
  const sections: ReadmeSection[] = [];
  const lines = readme.split(/\r?\n/);
  let currentTitle = "";
  let currentBody: string[] = [];

  const flush = () => {
    if (!currentTitle) {
      return;
    }
    sections.push({
      title: currentTitle,
      body: currentBody.join("\n").trim(),
    });
  };

  for (const line of lines) {
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) {
      flush();
      currentTitle = heading[1]?.replace(/^\d+\.\s*/, "") ?? "";
      currentBody = [];
      continue;
    }
    currentBody.push(line);
  }

  flush();
  return sections;
}

export function sectionByTitle(
  sections: ReadmeSection[],
  matcher: RegExp,
): ReadmeSection | undefined {
  return sections.find((section) => matcher.test(section.title));
}

export function paragraphList(body: string, limit = 4): string[] {
  return body
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .replace(/^[-*]\s+/gm, "")
        .replace(/^\|.+\|$/gm, "")
        .replace(/^#+\s+/gm, "")
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .trim(),
    )
    .filter((block) => block.length > 40 && !block.startsWith("|"))
    .slice(0, limit);
}
