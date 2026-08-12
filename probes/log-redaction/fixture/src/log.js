// App logger. One JSON line per event. Tests may redirect the stream by
// setting module.exports.sink.
function info(event, fields) {
  const line = JSON.stringify({ event, ...fields });
  const sink = module.exports.sink || ((l) => process.stdout.write(l + "\n"));
  sink(line);
}

module.exports = { info, sink: null };
