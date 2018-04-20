require 'open3'
require 'byebug'
DOCUMENTS_COUNT = 100_000 # We load only 1 packets of 100_000 documents in tests
TOTAL_NOTIFICATIONS_RECEIVED = 90 # 90 passengers arrive to Time square in the 100 000 first documents

Given("A Kuzzle stack running") do
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
    puts docker_compose_stderr.read_nonblock(99_999)
    puts docker_compose_stdout.read_nonblock(99_999)
    raise ArgumentError, "Unable to start docker-compose stack"
  end

  puts "Kuzzle is up !"
end

Then("I can load the dataset with bulk import") do
  Open3.popen3('docker-compose exec kuzzle node /scripts/loadBulk.js test') do |stdin, stdout, stderr, waiter|
    status = waiter.value

    if status.exitstatus != 0
      puts stderr.read
      raise ArgumentError, "Fail to insert data"
    end

    check_documents_count(DOCUMENTS_COUNT)
  end
end

Then("I can load the dataset with mCreate and a subscription") do
  Open3.popen3('docker-compose exec kuzzle node /scripts/subscribe.js') do |subscribe_stdin, subscribe_stdout, subscribe_stderr, subscribe_waiter|

    sleep 2 # Wait for subscription

    Open3.popen3('docker-compose exec kuzzle node /scripts/loadMCreate.js test') do |load_stdin, load_stdout, load_stderr, load_waiter|
      load_status = load_waiter.value

      if load_status.exitstatus != 0
        puts load_stderr.read
        raise ArgumentError, "Fail to insert data"
      end

      check_documents_count(DOCUMENTS_COUNT * 2)

      notifications = subscribe_stdout.read_nonblock(99_999)
      last_notification = notifications.split("\n").last
      notification_count = last_notification.match(/\[(?<count>\d+)\]/)&.named_captures&.dig('count')&.to_i

      if notification_count != TOTAL_NOTIFICATIONS_RECEIVED
        puts notifications
        raise ArgumentError, "Total received notifications mismatch"
      end
    end
  end
end
