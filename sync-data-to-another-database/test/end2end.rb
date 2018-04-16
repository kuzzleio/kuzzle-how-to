require 'open3'
require 'json'

def exit_script(status)
  puts "Stopping Kuzzle stack before exiting.."
  Open3.capture3('docker-compose down')
  exit status == :fail ? 1 : 0
end

puts "-------------------------------"
puts "[STEP 1] Start Kuzzle stack"
_, _, docker_compose_stderr = Open3.popen3("docker-compose up")

max_tries = 10
connected = false

while ! connected do
  stdout, stderr, status = Open3.capture3('curl localhost:7512')

  if status == 0
    connected = true
  elsif max_tries > 0
    max_tries -= 1
    sleep 2
  else
    puts "[STEP 1] Unable to start docker-compose stack"
    puts docker_compose_stderr.read
    exit_script :fail
  end
end
puts "[STEP 1] Kuzzle is up !"
sleep 5 # Wait for Cassandra initialization



puts "-------------------------------"
puts "[STEP 2] Check for Cassandra plugin"

kuzzle_info = JSON.parse(stdout)

if kuzzle_info.dig("result", "serverInfo", "kuzzle", "plugins", "kuzzle-plugin-sync-cassandra").nil?
  puts "[STEP 2] Cassandra plugin not mounted"
  exit_script :fail
else
  puts "[STEP 2] Cassandra plugin is mounted"
end



puts "-------------------------------"
puts "[STEP 3] Load dataset in Kuzzle"

Open3.popen3('docker-compose exec kuzzle node /scripts/load_data.js --max-count 10000 --batch-size 1000') do |stdin, stdout, stderr, waiter|
  status = waiter.value

  if status.exitstatus != 0
    puts "[STEP 3] Fail to load dataset"
    puts stderr.read
    exit_script :fail
  end

  puts "[STEP 3] Dataset successfuly loaded"
end

Open3.popen3('docker-compose exec kuzzle node /scripts/count_data.js') do |stdin, stdout, stderr, waiter|
  status = waiter.value

  if status.exitstatus != 0
    puts "[STEP 3] Fail to count inserted data"
    puts stderr.read
    exit_script :fail
  end

  kuzzle_line, cassandra_line = stdout.read.split("\n")

  if kuzzle_line.include?('10000') && cassandra_line.include?('10000')
    puts "[STEP 3] Cassandra synchronization ok"
  else
    puts "[STEP 3] Inserted lines mismatch"
    puts kuzzle_line, cassandra_line
    exit_script :fail
  end
end


exit_script :success
