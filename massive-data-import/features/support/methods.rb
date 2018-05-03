require "open3"

def check_documents_count(count)
  sleep 2 # Wait kuzzle to reindex

  Open3.popen3('docker-compose exec kuzzle node /scripts/countData.js') do |stdin, stdout, stderr, waiter|
    status = waiter.value

    if status.exitstatus != 0
      puts stderr.read
      raise StandardError, "Fail to count dataset"
    end

    count_stdout = stdout.read
    kuzzle_lines = count_stdout.scan(/\d+/).first.to_i

    if kuzzle_lines != count
      puts count_stdout
      raise StandardError, "Wrong number of documents"
    end
  end
end
