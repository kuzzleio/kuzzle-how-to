require 'open3'
require 'json'

Given("A Kuzzle stack with Cassandra running") do
  _, docker_compose_stdout, docker_compose_stderr = Open3.popen3("docker-compose up")

  max_tries = 12
  connected = false

  while ! connected  && max_tries > 0 do
    curl_stdout, curl_stderr, curl_status = Open3.capture3('curl localhost:7512')

    if curl_status == 0
      connected = true
    elsif max_tries > 0
      puts "[#{max_tries}] Waiting for kuzzle.."
      max_tries -= 1
      puts curl_stderr.split('curl:')[1]
      sleep 10
    end
  end

  if ! connected
    puts docker_compose_stderr.read_nonblock(99999)
    puts docker_compose_stdout.read_nonblock(99999)
    raise StandardError, "Unable to start docker-compose stack"
  end

  puts "Kuzzle is up !"
  sleep 5 # Wait for Cassandra keyspace initialization
end

Then("I can check the Cassandra plugin presence") do
  curl_stdout, curl_stderr, curl_status = Open3.capture3('curl localhost:7512')

  kuzzle_info = JSON.parse(curl_stdout)

  if kuzzle_info.dig("result", "serverInfo", "kuzzle", "plugins", "kuzzle-plugin-sync-cassandra").nil?
    puts curl_stderr
    puts curl_stdout
    raise StandardError, "Unable to find Cassandra plugin in plugins list"
  end
end

Then("I can load the test data into Kuzzle") do
  Open3.popen3('docker-compose exec kuzzle node /scripts/load_data.js --max-count 10000 --batch-size 1000') do |stdin, stdout, stderr, waiter|
    status = waiter.value

    if status.exitstatus != 0
      puts stderr.read
      raise StandardError, "Fail to load dataset"
    end
  end
end

Then("I can check if they are synchronized in Cassandra") do
  sleep 2 # Wait Cassandra refreshing his indexes
  Open3.popen3('docker-compose exec kuzzle node /scripts/count_data.js') do |stdin, stdout, stderr, waiter|
    status = waiter.value

    kuzzle_lines, cassandra_lines = stdout.read.split("\n").map { |line| line.scan(/\d+/).first.to_i }

    if status.exitstatus != 0
      puts stderr.read
      raise StandardError, "Fail to count inserted data"
    end

    if kuzzle_lines != cassandra_lines || kuzzle_lines == 0
      puts kuzzle_lines, cassandra_lines
      raise StandardError, "Inserted lines mismatch"
    end
  end
end
