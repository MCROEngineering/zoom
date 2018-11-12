const thisStep = async() => {

    describe('Mocha Init', async() => {
        xit("tests should work");
    });
    
};

setup.globals.runningTests.push( thisStep() );

