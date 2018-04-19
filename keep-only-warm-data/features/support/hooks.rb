require 'open3'

Before do |scenario|
  # this fixes the input device is not a TTY .. see https://github.com/docker/compose/issues/5696
  ENV['COMPOSE_INTERACTIVE_NO_CLI'] = '1'

  puts "Pull latests images from Docker Hub"
  Open3.capture3('docker-compose pull')
end

After do |scenario|
  puts "Stopping Kuzzle stack before exiting.."
  Open3.capture3('docker-compose down')
end
