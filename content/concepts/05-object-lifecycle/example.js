class Connection {
  constructor(name) {
    this.name = name;
    console.log(`connect ${name}`);
  }
  close() {
    console.log(`disconnect ${this.name}`);
  }
}

function withConnection(name, work) {
  const conn = new Connection(name);
  try {
    return work(conn);
  } finally {
    conn.close(); // runs on success AND on error
  }
}

withConnection("A", () => console.log("  using A"));
try {
  withConnection("B", () => {
    throw new Error("boom");
  });
} catch {
  console.log("  error handled - and B was still disconnected");
}

const team = { name: "Reds", players: ["Ada", "Alan"] };
const alias = team;
const shallow = { ...team };
const deep = structuredClone(team);
team.players.push("Grace");
console.log("alias sees:", alias.players);
console.log("shallow sees:", shallow.players, "(inner array shared)");
console.log("deep sees:", deep.players, "(fully independent)");
