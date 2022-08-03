# frozen_string_literal: true

require "rake/clean"

desc "Download and unzip the wasi-vfs executable"
file "wasi-vfs" do
  version = "0.1.1"
  filename =
    if ENV["CI"]
      "wasi-vfs-cli-x86_64-unknown-linux-gnu.zip"
    else
      "wasi-vfs-cli-x86_64-apple-darwin.zip"
    end

  `curl -LO "https://github.com/kateinoigakukun/wasi-vfs/releases/download/v#{version}/#{filename}"`
  `unzip #{filename}`
  rm filename
end

desc "Download and untar the Ruby WASI directory"
directory "head-wasm32-unknown-wasi-full-js" do
  require "json"
  version = JSON.parse(File.read("package.json"))["dependencies"]["ruby-head-wasm-wasi"][1..]
  filename = "ruby-head-wasm32-unknown-wasi-full-js.tar.gz"

  `curl -LO https://github.com/ruby/ruby.wasm/releases/download/ruby-head-wasm-wasi-#{version}/#{filename}`
  `tar xfz #{filename}`
  rm filename
end

desc "Extract the Ruby executable from the WASI directory"
file "ruby.wasm" => ["head-wasm32-unknown-wasi-full-js"] do
  cp "head-wasm32-unknown-wasi-full-js/usr/local/bin/ruby", "ruby.wasm"
end

desc "Build the app.wasm file with additional files built in"
file "src/app.wasm" => ["Gemfile.lock", "wasi-vfs", "ruby.wasm"] do
  require "bundler/setup"

  loaded_before = $LOADED_FEATURES.dup
  require "syntax_tree"
  require "syntax_tree/haml"
  # require "syntax_tree/rbs"
  loaded_after = $LOADED_FEATURES - loaded_before

  # Here we're going to find all of the gems that were loaded by requiring each
  # of the gems that we wanted. We do this because dependencies can require
  # their own dependencies recursively. Once everything is required, we can walk
  # through the loaded gems and find the ones we need.
  filepaths = loaded_after.group_by { |filepath| filepath[%r{/gems/(.+?)-\d}, 1] }
  gem_names = filepaths.keys.tap { |names| names.delete(nil) }.sort
  puts "Gems loaded: #{gem_names.join(", ")}"

  # Walk through each gem and copy all of their contents into the same lib
  # directory. This is nice because it allows us to only have to put one
  # directory onto the load path. It works because we're sure that all of the
  # gems are structured such that there isn't any overlap in the filepaths.
  mkdir "lib"
  gem_names.each do |gem_name|
    # Now that we know which gem we're attempting to load, we can find the lib
    # directory for that gem by looking through the load path that bundler
    # kindly set up for us.
    libdir = $:.find { _1.match?(%r{/#{gem_name}-\d}) }

    Dir["#{libdir}/**/*"].sort.each do |filepath|
      relative = "lib#{filepath.delete_prefix(libdir)}"

      if File.directory?(filepath)
        mkdir_p relative
      else
        cp filepath, relative
      end
    end
  end

  `./wasi-vfs pack ruby.wasm --mapdir /lib::./lib --mapdir /usr::./head-wasm32-unknown-wasi-full-js/usr -o src/app.wasm`
  rm_rf "lib"
end

CLOBBER.concat(%w[wasi-vfs head-wasm32-unknown-wasi-full-js ruby.wasm src/app.wasm lib])

task default: "src/app.wasm"
