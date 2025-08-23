

#!/bin/sh

# todo: figure out what contracts did have changed.

output_file="2025_08_04_contracts.txt"
NETWORK="--network beta1"

#npx hardhat $NETWORK analyze
#npx hardhat $NETWORK deployLowMajorityContract
npx hardhat --network beta1 getUpgradeCalldata --output "$output_file" --contract DiamondDao --init-func initializeV2 0xf30214ee3Be547E2E5AaaF9B9b6bea26f1Beca37 
