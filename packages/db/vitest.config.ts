const vitestConfig = {
  test: {
    environment: "node",
    pool: "threads",
    maxWorkers: 1,
    fileParallelism: false
  }
};

export default vitestConfig;
