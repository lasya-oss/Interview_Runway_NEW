// tsx asks os.userInfo() for a temporary-directory suffix on Windows. Some
// managed Windows hosts return UV_ENOMEM for that call even when the process
// has ample memory. A stable numeric suffix keeps the test loader portable and
// does not affect application code.
if (typeof process.geteuid !== "function") {
  process.geteuid = () => 0;
}
