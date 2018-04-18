require 'open3'

Before do |scenario|
  puts "Pull latests images from Docker Hub"
  Open3.capture3('docker-compose pull')
end

After do |scenario|
  puts "Stopping Kuzzle stack before exiting.."
  Open3.capture3('docker-compose down')
end
