pipeline {
    environment {
        DOCKER_HOST = 'tcp://host.docker.internal:2375'
    }
    agent {
        docker {
            image 'radeczu/node-with-jq'
            args '--add-host=host.docker.internal:host-gateway -e DOCKER_HOST=tcp://host.docker.internal:2375'
        }
    }
    triggers {
      pollSCM '*/5 * * * *'
    }
    stages {

      stage('Prepare') {
          steps {
              cleanWs()
          }
      }

        stage('Build') {
            steps {
                echo "Building.."
                sh '''
                ls -a
                npm install
                npm run start &> app.log &
                '''
            }
        }

        stage('Test') {
          steps {
              echo "Testing.."
              sh '''
              cd "$WORKSPACE"
              chmod +x test.sh
              ls -la
              sh test.sh
              '''
          }
        }

        stage('Containerize') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_TOKEN')]) {
                    echo 'Containerizing...'
                    sh '''
                    set -e
                    echo "DOCKER_HOST=$DOCKER_HOST"
                    docker info

                    local_v=$(jq -r '.version' package.json)

                    echo "Logging in to DockerHub..."
                    echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

                    echo "Pulling latest image..."
                    docker pull radeczu/apitestapp:latest || true

                    latest_tag=$(docker images radeczu/apitestapp --format "{{.Tag}}" | sort -V | tail -n 1)

                    echo "Local version: $local_v"
                    echo "Latest version tag: $latest_tag"

                    if [[ "$local_v" == "$latest_tag" ]]; then
                        echo "Versions match, incrementing patch..."
                        if [[ "$local_v" == *-* ]]; then
                            base="${local_v%-*}"
                            suffix="${local_v##*-}"
                            new_suffix=$((suffix + 1))
                            version="$base-$new_suffix"
                        else
                            version="${local_v}-1"
                        fi
                    else
                        version="$local_v"
                    fi

                    echo "Resulting version: $version"
                    echo "$version" > version.txt

                    docker build -t radeczu/apitestapp:$version .
                    docker tag radeczu/apitestapp:$version radeczu/apitestapp:latest
                    '''
                }
            }
        }

        stage('Deliver') {
            steps {
                echo 'Deliver....'
                sh '''
                 version=$(cat version.txt)
                  echo "Using version: $version"
                  echo "Pushing to DockerHub..."
                  docker push radeczu/apitestapp:$version
                  docker push radeczu/apitestapp:latest
                '''
            }
        }
    }
}