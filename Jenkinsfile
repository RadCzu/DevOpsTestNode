pipeline {
    agent {
        docker {
            image 'radeczu/node-with-jq:docker'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    triggers {
      pollSCM '*/5 * * * *'
    }
    stages {
        stage('Build') {
            steps {
                echo "Building.."
                sh '''
                npm install
                npm run start &> app.log &
                '''
            }
        }

        stage('Test') {
            steps {
                echo "Testing.."
                sh '''
                chmod +x test.sh
                ls -la
                ./test.sh
                '''
            }
        }

        stage('Containerize') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_TOKEN')]) {
                  echo 'Deliver....'
                  sh '''
                    set -e

                    local_v=$(jq -r '.version' package.json)

                    echo "Logging in to DockerHub..."
                    echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

                    echo "Pulling latest image..." 
                    docker pull radeczu/apitestapp:latest || true

                    latest_tag=$(docker images radeczu/apitestapp --format "{{.Tag}}" | sort -V | tail -n 1)

                    echo "Local version: $local_v"
                    echo "Latest  version tag: $latest_tag"

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
                    echo "Containerizing..."
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
                  echo "Pushing to DockerHub..."
                  docker push radeczu/apitestapp:$version
                  docker push radeczu/apitestapp:latest
                '''
            }
        }
    }
}