require 'open3'

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
    puts docker_compose_stderr.read_nonblock(99999)
    puts docker_compose_stdout.read_nonblock(99999)
    raise ArgumentError, "Unable to start docker-compose stack"
  end

  puts "Kuzzle is up !"
end
