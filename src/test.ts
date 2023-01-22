import { convertFilterOperator } from "./utils/query-to-where";

async function main() {
  const results = convertFilterOperator(
    {
      $notBetween: [10, 20],
    },
    require("sequelize")
  );
  console.log(results);
}
main();
