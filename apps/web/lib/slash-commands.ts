export interface SlashCommand {
  command: string;
  hint: string;
  description: string;
  execute: (args: string) => string | null;
}

const SHRUG = "¯\\_(ツ)_/¯";

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: "/me",
    hint: "<action>",
    description: "Display action text",
    execute: (args) => (args ? `_${args}_` : null),
  },
  {
    command: "/code",
    hint: "[language]",
    description: "Insert a code block",
    execute: (args) => {
      const lang = args || "";
      return `\`\`\`${lang}\n\n\`\`\``;
    },
  },
  {
    command: "/shrug",
    hint: "",
    description: "Append ¯\\_(ツ)_/¯",
    execute: () => SHRUG,
  },
  {
    command: "/poll",
    hint: "<question> | <option1> | <option2>",
    description: "Create a poll",
    execute: (args) => {
      const parts = args.split("|").map((s) => s.trim());
      if (parts.length < 3) return null;
      const question = parts[0];
      const options = parts.slice(1);
      const poll = [`**Poll: ${question}**`, ""];
      options.forEach((opt, i) => {
        poll.push(`${i + 1}. ${opt}`);
      });
      return poll.join("\n");
    },
  },
  {
    command: "/gif",
    hint: "<search term>",
    description: "Search and share a GIF",
    execute: () => null, // Placeholder - would need GIF API
  },
  {
    command: "/collapse",
    hint: "",
    description: "Collapse the previous message",
    execute: () => "||​||", // Zero-width space to prevent empty collapse
  },
  {
    command: "/help",
    hint: "",
    description: "Show available commands",
    execute: () => {
      const lines = ["**Available commands:**", ""];
      SLASH_COMMANDS.forEach((cmd) => {
        lines.push(`- \`${cmd.command} ${cmd.hint}\` — ${cmd.description}`);
      });
      return lines.join("\n");
    },
  },
];

export function getMatchingCommands(input: string): SlashCommand[] {
  if (!input.startsWith("/")) return [];
  const partial = input.toLowerCase();
  return SLASH_COMMANDS.filter((cmd) => cmd.command.startsWith(partial));
}

export function executeCommand(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;

  const spaceIdx = trimmed.indexOf(" ");
  const command = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const args = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();

  const cmd = SLASH_COMMANDS.find((c) => c.command === command);
  if (!cmd) return null;

  const result = cmd.execute(args);
  if (result === null) return null;

  // For /code, keep the command text. For others, replace with result
  if (command === "/code") return result;
  if (command === "/help") return result;
  return result;
}
