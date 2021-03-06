import React from 'react';
import PropTypes from 'prop-types';
import { mount, shallow } from 'enzyme';
import Wizard from './Wizard';
import WizardContext from '../context';

const Steps = ({ children }) => children;
Steps.defaultProps = {
  isSteps: true,
};

const Step = ({ children }) => (
  <WizardContext.Consumer>
    {context => (typeof children === 'function' ? children(context) : children)}
  </WizardContext.Consumer>
);

Step.propTypes = {
  children: PropTypes.any,
};

Step.defaultProps = {
  isStep: true,
};

describe('Wizard', () => {
  describe('with no props', () => {
    let wrapper;
    let activeStepIndex;
    let goToNextStep;
    let goToPrevStep;
    let goToStep;
    let totalSteps;
    const onStepChanged = jest.fn();
    const onWizardFinished = jest.fn();

    beforeEach(() => {
      wrapper = mount(
        <Wizard
          onStepChanged={onStepChanged}
          onWizardFinished={onWizardFinished}
        >
          <Steps>
            <Step id="first">
              {({
                activeStepIndex: wizardActiveStepIndex,
                goToNextStep: wizardGoToNextStep,
                goToPrevStep: wizardGoToPrevStep,
                goToStep: wizardGoToStep,
                totalSteps: wizardTotalSteps,
              }) => {
                activeStepIndex = wizardActiveStepIndex;
                goToNextStep = wizardGoToNextStep;
                goToPrevStep = wizardGoToPrevStep;
                goToStep = wizardGoToStep;
                totalSteps = wizardTotalSteps;
                return null;
              }}
            </Step>
            <Step id="second">2</Step>
          </Steps>
        </Wizard>,
      );
    });

    let firstStep;
    let secondStep;
    let lastStep;
    let goToLastStep;

    beforeEach(() => {
      firstStep = 0;
      secondStep = 1;
      lastStep = secondStep;
      goToLastStep = () => goToStep(lastStep);
      onStepChanged.mockReset();
      onWizardFinished.mockReset();
    });

    it('renders its steps', () => {
      expect(wrapper.contains(Steps)).toBe(true);
    });

    it('returns the number of steps', () => {
      expect(totalSteps).toBe(2);
    });

    it('starts at first step', () => {
      expect(activeStepIndex).toBe(firstStep);
    });

    it('moves to given step', () => {
      goToStep(firstStep);

      expect(activeStepIndex).toBe(firstStep);
    });

    it('moves to next step', () => {
      goToStep(firstStep);
      goToNextStep();

      expect(activeStepIndex).toBe(secondStep);
    });

    it('does not move to next step when in the last step', () => {
      goToLastStep();
      goToNextStep();

      expect(activeStepIndex).toBe(lastStep);
    });

    it('executes onFinishWizard callback when trying to navigate to last step', () => {
      goToLastStep();
      goToNextStep();

      expect(onWizardFinished).toHaveBeenCalled();
    });

    it('moves back to prev step', () => {
      goToStep(secondStep);
      goToPrevStep();

      expect(activeStepIndex).toBe(firstStep);
    });

    it('does not move to prev step when in the first step', () => {
      goToStep(firstStep);
      goToPrevStep();

      expect(activeStepIndex).toBe(firstStep);
    });

    it('executes a callback when moving through steps', () => {
      goToNextStep();

      expect(onStepChanged).toBeCalledWith({
        activeStepIndex: 1,
        step: { id: 'second' },
      });
    });
  });

  describe('passing defaultActiveStepIndex prop', () => {
    it('starts at given step', () => {
      let activeStepIndex;
      mount(
        <Wizard defaultActiveStepIndex={1}>
          <Steps>
            <Step id="first">1</Step>
            <Step id="second">
              {({ activeStepIndex: wizardActiveStepIndex }) => {
                activeStepIndex = wizardActiveStepIndex;
                return null;
              }}
            </Step>
          </Steps>
        </Wizard>,
      );

      expect(activeStepIndex).toBe(1);
    });
  });

  describe('passing activeStepIndex prop', () => {
    it('keeps the state in the component rendering the wizard,', () => {
      class ControlledWizard extends React.Component {
        constructor(props) {
          super(props);

          this.state = {
            activeStepIndex: 0,
          };
        }

        render() {
          return (
            <Wizard
              activeStepIndex={this.state.activeStepIndex}
              onStepChanged={({ activeStepIndex }) =>
                this.setState({ activeStepIndex })
              }
            >
              <Steps>
                <Step id="first">
                  {({ goToNextStep }) => {
                    return (
                      <button onClick={goToNextStep}>Go to next step</button>
                    );
                  }}
                </Step>
                <Step id="second">2</Step>
              </Steps>
            </Wizard>
          );
        }
      }

      const wrapper = mount(<ControlledWizard />);
      wrapper.find('button').simulate('click');

      expect(wrapper.state().activeStepIndex).toBe(1);
    });
  });

  describe('passing history prop', () => {
    it('appends the current step id in the URL', () => {
      const push = jest.fn();
      const replace = jest.fn();
      const history = {
        listen: () => {},
        push,
        replace,
      };

      const wrapper = mount(
        <Wizard history={history} baseUrl="/steps">
          <Steps>
            <Step id="first">
              {({ goToNextStep }) => {
                return <button onClick={goToNextStep}>Go to next step</button>;
              }}
            </Step>
            <Step id="second">2</Step>
          </Steps>
        </Wizard>,
      );

      expect(replace).toHaveBeenCalledWith('/steps/first');

      wrapper.find('button').simulate('click');

      expect(push).toHaveBeenCalledWith('/steps/second');
    });

    describe('with conditional step', () => {
      it('ignores the step', () => {
        const push = jest.fn();
        const replace = jest.fn();
        const history = {
          listen: () => {},
          push,
          replace,
        };

        mount(
          <Wizard history={history} baseUrl="/steps">
            <Steps>
              {false && <Step id="first">1</Step>}
              <Step id="second">2</Step>
            </Steps>
          </Wizard>,
        );

        expect(replace).not.toHaveBeenCalledWith('/steps/first');
        expect(replace).toHaveBeenCalledWith('/steps/second');
      });
    });

    describe('with new props', () => {
      const component = shallow(
        <Wizard>
          <Steps />
        </Wizard>,
      );

      it('sets new steps', () => {
        const spy = jest.spyOn(Wizard.prototype, 'steps', 'get');
        component.setProps({ children: <Steps /> });

        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
      });

      it('does not set new steps when children are not updated', () => {
        const spy = jest.spyOn(Wizard.prototype, 'steps', 'get');
        component.setProps({ aProp: 'prop' });

        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
      });
    });
  });
});
