import { convertFilterOperator } from "./utils/query-to-where";

async function main() {
  const results = convertFilterOperator(
    [["createdAt", "desc"]],
    require("sequelize")
  );
  console.log(results);
}
main();
