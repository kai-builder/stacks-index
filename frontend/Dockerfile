FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067

ENTRYPOINT ["/bin/bash", "-l", "-c"]
WORKDIR /app/




ARG NIXPACKS_METADATA
ENV NIXPACKS_METADATA=$NIXPACKS_METADATA

# setup phase
# noop

# build phase
COPY . /app/.
RUN  deno cache components/deposit/index.ts




# start
COPY . /app

CMD ["deno run --allow-all components/deposit/index.ts"]