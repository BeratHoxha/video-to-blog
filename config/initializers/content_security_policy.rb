Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.font_src    :self, :https, :data
    policy.img_src     :self, :https, :data
    policy.object_src  :none
    policy.style_src   :self, :https, :unsafe_inline

    if Rails.env.development?
      vite_host = "http://#{ViteRuby.config.host_with_port}"
      ws_host   = "ws://#{ViteRuby.config.host_with_port}"

      policy.script_src  :self, :unsafe_eval, :unsafe_inline, vite_host
      policy.connect_src :self, vite_host, ws_host
    else
      policy.script_src  :self, :https
      policy.connect_src :self, :https
    end
  end
end
