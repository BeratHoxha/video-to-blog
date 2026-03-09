Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.font_src    :self, :https, :data
    policy.img_src     :self, :https, :data
    policy.object_src  :none
    policy.style_src   :self, :https, :unsafe_inline
    # Paddle.js checkout overlay
    policy.frame_src   :self, "https://sandbox-buy.paddle.com",
                       "https://buy.paddle.com",
                       "https://checkout-service.paddle.com"
    # Allow @vite/client to hot reload style changes in development
    #    policy.style_src *policy.style_src, :unsafe_inline if Rails.env.development?

    paddle_cdn        = "https://cdn.paddle.com"
    paddle_sandbox    = "https://sandbox-cdn.paddle.com"
    profitwell        = "https://public.profitwell.com"

    if Rails.env.development?
      vite_host = "http://#{ViteRuby.config.host_with_port}"
      ws_host   = "ws://#{ViteRuby.config.host_with_port}"

      policy.script_src  :self, :unsafe_eval, :unsafe_inline, vite_host,
                         paddle_cdn, paddle_sandbox, profitwell
      policy.connect_src :self, vite_host, ws_host,
                         "https://sandbox-api.paddle.com",
                         "https://checkout-service.paddle.com",
                         profitwell,
                         "wss://*.ngrok-free.app", "wss://*.ngrok-free.dev",
                         "wss://*.ngrok.io"
    else
      policy.script_src  :self, :https, paddle_cdn, profitwell
      policy.connect_src :self, :https, "https://checkout-service.paddle.com"
    end
  end
end
